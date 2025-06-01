from setuptools import setup, find_packages

setup(
    name="tf2-arbitrage",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "requests",
        "websocket-client",
        "websockets",
        "tf2-utils",
        "tf2-sku",
        "tf2-data",
        "bptf",
        "pymongo"
    ],
) 