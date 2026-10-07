#include "../include/BloodUnit.h"

#include <iostream>

using namespace std;

BloodUnit::BloodUnit()
{
    unitId = "";
    bloodGroup = "";
    expiryDate = "";
    status = "Available";
}

BloodUnit::BloodUnit(string id, string group,
                     string expiry, string unitStatus)
{
    unitId = id;
    bloodGroup = group;
    expiryDate = expiry;
    status = unitStatus;
}

string BloodUnit::getUnitId() const
{
    return unitId;
}

string BloodUnit::getBloodGroup() const
{
    return bloodGroup;
}

string BloodUnit::getExpiryDate() const
{
    return expiryDate;
}

string BloodUnit::getStatus() const
{
    return status;
}

void BloodUnit::setStatus(string newStatus)
{
    status = newStatus;
}

bool BloodUnit::isAvailable() const
{
    return status == "Available";
}

void BloodUnit::display() const
{
    cout << "Blood Unit ID   : " << unitId << endl;
    cout << "Blood Group     : " << bloodGroup << endl;
    cout << "Expiry Date     : " << expiryDate << endl;
    cout << "Status          : " << status << endl;
}