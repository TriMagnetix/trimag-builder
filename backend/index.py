#!/usr/bin/env python

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import docker
import os
import shutil
import tempfile
import json
from schemas import magnetization_fields_list_schema
from jsonschema import validate, ValidationError

PORT = 1235
container_dir = "/mnt"
docker_image_name = "nmag"
docker_username = "nmag"
client = docker.from_env()
app = Flask(__name__)
CORS(app, origins=["http://localhost:1234"])

@app.route("/nsim", methods=["POST"])
def run_command():
    if "file" not in request.files:
        return jsonify({"error": "Nmesh file wasn't found attached to request"})

    # Get the file from the request
    file = request.files["file"]

    magnetization_fields = json.loads(request.form.get("magnetizationFields"))
    try: 
        validate(instance=magnetization_fields, schema=magnetization_fields_list_schema)
    except ValidationError as e:
        return jsonify({"error": "Failed to validate magnetization_fields json", "details": e.message})

    with tempfile.TemporaryDirectory() as temp_dir:
        # Save the magnetization data into a file so it can be accessed via the nsim.py script 
        with open(os.path.join(temp_dir, "magnetization_fields.json"), "w") as magnetization_fields_file:
            json.dump(magnetization_fields, magnetization_fields_file)
        # Save the neccassary python script within the tmp directory that will be mounted
        shutil.copy("nsim.py", os.path.join(temp_dir, "nsim.py"))
        # Save the user provided nmesh file to the tmp directory that will be mounted
        file.save(os.path.join(temp_dir, "generated.nmesh"))
        container = client.containers.run(
            image=docker_image_name,
            volumes={
                temp_dir: { "bind": container_dir, "mode": "rw"}
            },
            user=docker_username,
            # Run neccassary commands for nmag simulation.
            # export USER is needed because for nmag needs the USER 
            # var to be set which doesn't happen by default in docker.
            entrypoint=["/bin/bash", "-c", f"export USER={docker_username} && cd {container_dir} && nmeshpp -c generated.nmesh generated.nmesh.h5 && nsim nsim.py"],
            # Remove container when we are done with it
            auto_remove=True,
            # Block on execution of the entrypoint command
            # Note: If we want multiple tasks to be run on the same server 
            # instance we should implement polling on the client and have the 
            # simulation run in the background or use web sockets for real time updates.
            detach=False
        )

        return send_file(
            os.path.join(temp_dir, "nsim_dat.ndt"),
            as_attachment=True,
            mimetype="text/plain",
        )


if __name__ == "__main__":
    # Run flask server
    app.run(host="0.0.0.0", port=PORT, debug=False, use_reloader=True)
