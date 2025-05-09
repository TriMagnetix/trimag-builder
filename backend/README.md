Prerequisites
* Python 3.9 or higher (with python3 aliased to python)
* [Docker](https://www.docker.com/products/docker-desktop/)
* Nmag image
  * `docker image pull nmag/nmag-12.04`
  * `docker tag nmag/nmag-12.04 nmag:latest`

Installation
* Create a virtual environment: `python -m venv venv`
* Activate the virtual environment:
  * On Windows: `venv\Scripts\activate`
  * On macOS/Linux: `source venv/bin/activate`
* Install the required dependencies: `pip install -r requirements.txt`

Running
* `python index.py` or `./index.py`