#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status.
# Macchangerizer.sh script by Manuel Berrueta tweaked by LifeOfCoding
# Use to automate persistence of mac address spoofing 
# prior to connecting to WiFi Access Point

# We will stop the network manager service and bring down wlo1,
# so that after the mac address is modified the change can be persistent effect.
# Then we will use macchanger to spoof the mac address of wlo1
# We finish by starting the network manager service and bringing wlo1 back up. 

# NOTE: wlo1 is an example WiFi adapter name used here; it may be different on your system,
# especially if you are using an external or more than one wifi adapter.
# especially if you are using an external or more than one wifi adapter.

# To identify your WiFi adapter use the command ifconfig or ip adddr
# If it is to be something other than wlo1,
# modify the code to the name of your WiFi adapter.
iface="${1}"

if [ -z "${iface}" ]; then
    echo "Error: Network interface must be provided as the first argument."
    exit 1
fi

#Check current MAC address settings using macchanger
echo "Checking current MAC address..."
sudo macchanger -s "${iface}"
#Stop the network manager service
echo "Stopping NetworkManager..."
sudo service NetworkManager stop
#Bring down wlo1 
echo "Bringing interface ${iface} down..."
sudo ifconfig "${iface}" down
#Assign new random MAC address
echo "Assigning new random MAC address..."
sudo macchanger -a "${iface}"
#Bring adapter back up
echo "Bringing interface ${iface} up..."
sudo ifconfig "${iface}" up
#Bring network manager service back up
echo "Starting NetworkManager..."
sudo service NetworkManager start
