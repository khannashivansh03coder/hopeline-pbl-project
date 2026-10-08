#ifndef JSONMANAGER_H
#define JSONMANAGER_H

#include <string>
#include <vector>

#include "Patient.h"
#include "Donor.h"
#include "BloodUnit.h"
#include "../modules/parikshit/Hospital.h"

#include <nlohmann/json.hpp>

using namespace std;
using json = nlohmann::json;

class JsonManager
{
private:
    string patientFile;
    string donorFile;
    string bloodUnitFile;
    string resourceFile;

public:
    JsonManager();

    // Patient
    void savePatient(const Patient& patient);
    void loadPatients(vector<Patient>& patients);

    // Donor
    void saveDonor(const Donor& donor);
    void loadDonors(vector<Donor>& donors);

    // Blood Unit
    void saveBloodUnit(const BloodUnit& unit);
    void loadBloodUnits(vector<BloodUnit>& units);

    // Hospital Resources
    void saveResources(Hospital& hospital);
    void loadResources(Hospital& hospital);
};

#endif
