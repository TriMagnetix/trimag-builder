# Magnetization Enum Schema
# Represents the possible states of magnetization.
magnetization_enum_schema = {
    "type": "string",
    "enum": ["positive", "negative", "none"],
    "description": "Represents the possible states of magnetization."
}

# Point Interface Schema
# @interface Point
# @property exterior - If this point is visible when rendering.
# @property x - The x coordinate of the point.
# @property y - The y coordinate of the point.
# @property z - The z coordinate of the point.
point_schema = {
    "type": "object",
    "properties": {
        "exterior": {"type": "boolean", "description": "If this point is visible when rendering.", "nullable": True},
        "x": {"type": "number", "description": "The x coordinate of the point."},
        "y": {"type": "number", "description": "The y coordinate of the point."},
        "z": {"type": "number", "description": "The z coordinate of the point."}
    },
    "required": ["x", "y", "z"],
    "additionalProperties": False,
    "description": "Represents a point in 3D space, with an optional exterior flag."
}

# MagnetizationField Interface Schema
# @interface MagnetizationField
# @property points -
# Outer array of length 2 and inner arrays of length 4 to represent the bounds of the rectangular cuboid
# @property magnetization - Negative or positive magnetization
magnetization_field_schema = {
    "type": "object",
    "properties": {
        "points": {
            "type": "array",
            "description": "Outer array of length 2 and inner arrays of length 4 to represent the bounds of the rectangular cuboid",
            "items": {
                "type": "array",
                "items": point_schema,
                "minItems": 4, # Assuming inner arrays are always length 4 based on typical cuboid representation
                "maxItems": 4
            },
            "minItems": 2, # Assuming outer array is always length 2 for min/max bounds or similar
            "maxItems": 2
        },
        "magnetization": magnetization_enum_schema
    },
    "required": ["points", "magnetization"],
    "additionalProperties": False,
    "description": "Represents a field of magnetization within a defined set of points."
}

# Top-level schema for the 'magnetizationFields' array
# This is the schema for the data you will be sending to the backend.
magnetization_fields_list_schema = {
    "type": "array",
    "items": magnetization_field_schema,
    "description": "An array of MagnetizationField objects."
}
