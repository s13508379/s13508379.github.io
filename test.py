from pymarker.core import generate_patt, generate_marker

def main():
    filename = "tests/input/hiro.jpg"
    border_size = 50 

    generate_patt(filename)
    generate_marker(filename,border_size)
