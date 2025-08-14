import nmag
from nmag import SI
import json
import random

class Vector3:
    def __init__(self, x, y, z):
        self.x = float(x)
        self.y = float(y)
        self.z = float(z)

    def __sub__(self, other):
        return Vector3(self.x - other.x, self.y - other.y, self.z - other.z)
    
    def dot(self, other):
        return self.x * other.x + self.y * other.y + self.z * other.z
        
    def __str__(self):
        return "(%s, %s, %s)" % (self.x, self.y, self.z)

"""
Checks if a point is inside an axis-aligned bounding box.

Args:
    point (Point): The point to check.
    aabb (dict): The AABB dictionary with 'min' and 'max' keys.
"""
def is_point_inside_aabb(point, aabb):
    x_min = aabb['min']['x']
    x_max = aabb['max']['x']
    y_min = aabb['min']['y']
    y_max = aabb['max']['y']
    z_min = aabb['min']['z']
    z_max = aabb['max']['z']
    
    return (
        point['x'] >= x_min and point['x'] <= x_max and
        point['y'] >= y_min and point['y'] <= y_max and
        point['z'] >= z_min and point['z'] <= z_max
    )

"""
Checks if a point is inside a prism using an AABB heuristic and vector projection.
Same logic as the similar JavaScript function used in rendering.

Args:
    point (Point): The point to check.
    magField (dict): A dictionary with 'points', 'aabb', and 'magnetization' properties.

Returns:
    bool: True if the point is inside, False otherwise.
"""
def is_point_inside_mag_field(point, magField):
    if not is_point_inside_aabb(point, magField['aabb']):
        return False

    rect1, rect2 = magField['points']
    
    p0 = Vector3(rect1[0]['x'], rect1[0]['y'], rect1[0]['z'])
    p_test = Vector3(point.x, point.y, point.z)
    
    u = Vector3(rect1[3]['x'], rect1[3]['y'], rect1[3]['z']) - p0
    v = Vector3(rect2[0]['x'], rect2[0]['y'], rect2[0]['z']) - p0
    w = Vector3(rect1[1]['x'], rect1[1]['y'], rect1[1]['z']) - p0
    
    to_point = p_test - p0
    
    u_projection = to_point.dot(u)
    v_projection = to_point.dot(v)
    w_projection = to_point.dot(w)

    u_squared_len = u.dot(u)
    v_squared_len = v.dot(v)
    w_squared_len = w.dot(w)

    return (
        u_projection >= 0 and u_projection <= u_squared_len and
        v_projection >= 0 and v_projection <= v_squared_len and
        w_projection >= 0 and w_projection <= w_squared_len
    )


# Open the json file with magnetization data that was created as part of the /nsim POST request in index.py
with open("magnetization_fields.json", "r") as magnetization_fields_file:
    magnetization_fields = json.load(magnetization_fields_file)

def set_initial_mag(point):
    pointObj = {
        "x": point[0],
        "y": point[1],
        "z": point[2],
    }
    for magField in magnetization_fields:
        if is_point_inside_mag_field(pointObj, magField):
            vector = magField["vector"]
            return [vector.x, vector.y, vector.z]
    # Set a random vector because a 0 vector ends up in a divide 
    # by 0 error because the regions aren't proprerly tagged
    return [random.random() for _ in range(3)]

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
sim.set_m(set_initial_mag)

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

