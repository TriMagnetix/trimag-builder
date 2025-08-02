import nmag
from nmag import SI
import json

# File based on https://nmag.readthedocs.io/en/latest/example1/doc.html, it is in python 2.74

# Open the json file with magnetization data that was created as part of the /nsim POST request in index.py
with open("magnetization_fields.json", "r") as magnetization_fields_file:
    magnetization_fields = json.load(magnetization_fields_file)

def set_initial_mag(point):
	x, y, z = point

#create simulation object
sim = nmag.Simulation()

# define magnetic material
Py = nmag.MagMaterial(name = "Py",
                      Ms = SI(1e6, "A/m"),
                      exchange_coupling = SI(13.0e-12, "J/m"))

# load mesh
sim.load_mesh("generated.nmesh.h5",
              [("generated", Py)],
              unit_length = SI(1e-9, "m"))

# set initial magnetisation
sim.set_m([1,0,0])

# set external field
sim.set_H_ext([0,0,0], SI("A/m"))

# Save and display data in a variety of ways
sim.save_data(fields="all") # save all fields spatially resolved
                            # together with average data

# sample demag field through sphere
for i in range(-10,11):
    x = i*1e-9                      #position in metres
    H_demag = sim.probe_subfield_siv("H_demag", [x,0,0])
    print 
    "x =", x, ": H_demag = ", H_demag

