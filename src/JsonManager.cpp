#include "JsonManager.h"

#include <fstream>
#include <iostream>
#include <cstdio>

using namespace std;

JsonManager::JsonManager()
{
    patientFile = "data/patients.json";
    donorFile = "data/donors.json";
    bloodUnitFile = "data/blood_units.json";
    resourceFile = "data/resources.json";
}

// ---------------- PATIENT ----------------

void JsonManager::savePatient(const Patient& patient)
{
    json data = json::array();

    ifstream inFile(patientFile);

    if (inFile)
    {
        try
        {
            inFile >> data;
        }
        catch (...)
        {
            data = json::array();
        }

        inFile.close();
    }

    json patientData;

    patientData["patientId"] = patient.getPatientId();
    patientData["name"] = patient.getName();
    patientData["age"] = patient.getAge();
    patientData["bloodGroup"] = patient.getBloodGroup();
    patientData["severity"] = patient.getSeverity();
    patientData["riskLevel"] = patient.getRiskLevel();
    patientData["waitingTime"] = patient.getWaitingTime();
    patientData["registrationTime"] = patient.getRegistrationTime();
    
    patientData["requiredResource"] = patient.getRequiredResource();
    patientData["bloodRequired"] = patient.getBloodRequired();

    data.push_back(patientData);

    ofstream outFile(patientFile);
    outFile << data.dump(4);
    outFile.close();
}


void JsonManager::loadPatients(vector<Patient>& patients)
{
    ifstream inFile(patientFile);

    if (!inFile)
        return;

    json data;
    inFile >> data;

    patients.clear();

    for (auto& item : data)
    {
        time_t regTime = 0;

        if (item.contains("registrationTime"))
        {
            regTime = item["registrationTime"].get<time_t>();
        }
        else
        {
            regTime = time(nullptr) -
                      (item["waitingTime"].get<int>() * 60);
        }

        Patient patient(
            item["patientId"],
            item["name"],
            item["age"],
            item["bloodGroup"],
            item["severity"],
            item["riskLevel"],
            item["waitingTime"],
            item["requiredResource"],
            item["bloodRequired"],
            regTime
        );

        patients.push_back(patient);
    }

    inFile.close();
}



bool JsonManager::deletePatient(int patientId)
{
    json data;
    const string tempFile = patientFile + ".tmp";

    // Read the existing patient records
    ifstream inFile(patientFile);

    if (!inFile.is_open())
    {
        cerr << "Error: Could not open patient JSON file.\n";
        return false;
    }

    try
    {
        inFile >> data;
    }
    catch (const json::exception& e)
    {
        cerr << "Error: Patient JSON file is invalid: "
             << e.what() << '\n';
        return false;
    }

    inFile.close();

    // Ensure the JSON contains an array
    if (!data.is_array())
    {
        cerr << "Error: Patient data is not a JSON array.\n";
        return false;
    }

    // Find the patient using the actual patient ID
    auto it = data.begin();

    while (it != data.end())
    {
        if (it->is_object() &&
            it->contains("patientId") &&
            (*it)["patientId"].is_number_integer() &&
            (*it)["patientId"].get<int>() == patientId)
        {
            break;
        }

        ++it;
    }

    // Do not modify the file if the ID does not exist
    if (it == data.end())
    {
        return false;
    }

    data.erase(it);

    // Write the updated data to a temporary file first
    {
        ofstream outFile(tempFile);

        if (!outFile.is_open())
        {
            cerr << "Error: Could not create temporary patient file.\n";
            return false;
        }

        outFile << data.dump(4);
        outFile.close();

        if (!outFile)
        {
            cerr << "Error: Could not write updated patient data.\n";
            return false;
        }
    }

    // Replace the original file only after writing succeeds
    if (rename(tempFile.c_str(), patientFile.c_str()) != 0)
    {
        cerr << "Error: Could not replace patient JSON file.\n";
        return false;
    }

    return true;
}


// ---------------- DONOR ----------------

void JsonManager::saveDonor(const Donor& donor)
{
    json data = json::array();

    ifstream inFile(donorFile);

    if (inFile)
    {
        try
        {
            inFile >> data;
        }
        catch (...)
        {
            data = json::array();
        }

        inFile.close();
    }

    json donorData;

    donorData["donorId"] = donor.getDonorId();
    donorData["name"] = donor.getName();
    donorData["bloodGroup"] = donor.getBloodGroup();
    donorData["available"] = donor.isAvailable();
    donorData["distance"] = donor.getDistance();
    donorData["lastDonationDate"] = donor.getLastDonationDate();

    data.push_back(donorData);

    ofstream outFile(donorFile);
    outFile << data.dump(4);
    outFile.close();
}

void JsonManager::loadDonors(vector<Donor>& donors)
{
    ifstream inFile(donorFile);

    if (!inFile)
        return;

    json data;
    inFile >> data;

    donors.clear();

    for (auto& item : data)
    {
        Donor donor(
            item["donorId"],
            item["name"],
            item["bloodGroup"],
            item["available"],
            item["distance"],
            item["lastDonationDate"]
        );

        donors.push_back(donor);
    }

    inFile.close();
}

// ---------------- BLOOD UNIT ----------------

void JsonManager::saveBloodUnit(const BloodUnit& unit)
{
    json data = json::array();

    ifstream inFile(bloodUnitFile);

    if (inFile)
    {
        try
        {
            inFile >> data;
        }
        catch (...)
        {
            data = json::array();
        }

        inFile.close();
    }

    json unitData;

    unitData["unitId"] = unit.getUnitId();
    unitData["bloodGroup"] = unit.getBloodGroup();
    unitData["expiryDate"] = unit.getExpiryDate();
    unitData["status"] = unit.getStatus();

    data.push_back(unitData);

    ofstream outFile(bloodUnitFile);
    outFile << data.dump(4);
    outFile.close();
}

void JsonManager::loadBloodUnits(vector<BloodUnit>& units)
{
    ifstream inFile(bloodUnitFile);

    if (!inFile)
        return;

    json data;
    inFile >> data;

    units.clear();

    for (auto& item : data)
    {
        BloodUnit unit(
            item["unitId"],
            item["bloodGroup"],
            item["expiryDate"],
            item["status"]
        );

        units.push_back(unit);
    }

    inFile.close();
}

// ---------------- RESOURCES ----------------

void JsonManager::saveResources(Hospital& hospital)
{
    json data = json::array();

    for (int id = 1; id <= 15; id++)
    {
        Resource* resource = hospital.findResource(id);

        if (resource == nullptr)
            continue;

        json resourceData;

        resourceData["id"] = resource->getId();
        resourceData["type"] = resource->getType();

        ResourceState state = resource->getState();

        if (state == ResourceState::AVAILABLE)
            resourceData["state"] = "AVAILABLE";
        else if (state == ResourceState::OCCUPIED)
            resourceData["state"] = "OCCUPIED";
        else
            resourceData["state"] = "RESERVED";

        data.push_back(resourceData);
    }

    ofstream outFile(resourceFile);
    outFile << data.dump(4);
    outFile.close();
}
// ---------------- LOAD RESOURCES ----------------

void JsonManager::loadResources(Hospital& hospital)
{
    ifstream inFile(resourceFile);

    if (!inFile)
        return;

    json data;
    inFile >> data;

    for (auto& item : data)
    {
        int id = item["id"];
        string state = item["state"];

        Resource* resource = hospital.findResource(id);

        if (resource == nullptr)
            continue;

        if (state == "OCCUPIED")
        {
            hospital.allocateResource(id);
        }
        else if (state == "RESERVED")
        {
            hospital.reserveResource(id);
        }
    }

    inFile.close();
}
