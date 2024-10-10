import sys
import json

def usage():
	print(f'usage: {sys.argv[0]} meshfile')

def parse_meshfile(meshfile):
	lines = meshfile.readlines()
	num_points = int(lines[0])
	num_tetrahedrons = int(lines[num_points + 1])
	
	# extract points

	points = [

		{
			'x': float(x),
			'y': float(y),
			'z': float(z),
			'exterior': True, # TODO: determine if the point is exterior
		}

		for [x, y, z] in [
			line.split() for line in lines[1 : num_points + 1]
		]
	]

	# extract tetrahedrons

	tetrahedrons = [
		
		[
			points[int(p1) - 1],
			points[int(p2) - 1],
			points[int(p3) - 1],
			points[int(p4) - 1],
		]

		for [_, p1, p2, p3, p4]
			in [
				line.split()
				for line in lines[num_points + 2 : num_points + num_tetrahedrons + 2]
			]
	]

	return tetrahedrons

def export_json(tetrahedrons):
	outfile_name = ''.join(sys.argv[1].rsplit('.mesh', 1)) + '.json'

	with open(outfile_name, 'w') as outfile:
		json.dump(tetrahedrons, outfile)

	print(f'written: {outfile.name}')

def main():
	if len(sys.argv) != 2: return usage()

	with open(sys.argv[1]) as meshfile:
		tetrahedrons = parse_meshfile(meshfile)
		export_json(tetrahedrons)

if __name__ == '__main__':
	main()
