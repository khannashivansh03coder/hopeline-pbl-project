#include "../include/DonorMatching.h"

#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

bool DonorMatching::isCompatible(string donorGroup,
                                  string patientGroup) const
{
    if (donorGroup == "O-")
    {
        return true;
    }

    if (donorGroup == "O+")
    {
        return patientGroup == "O+" ||
               patientGroup == "A+" ||
               patientGroup == "B+" ||
               patientGroup == "AB+";
    }

    if (donorGroup == "A-")
    {
        return patientGroup == "A-" ||
               patientGroup == "A+" ||
               patientGroup == "AB-" ||
               patientGroup == "AB+";
    }

    if (donorGroup == "A+")
    {
        return patientGroup == "A+" ||
               patientGroup == "AB+";
    }

    if (donorGroup == "B-")
    {
        return patientGroup == "B-" ||
               patientGroup == "B+" ||
               patientGroup == "AB-" ||
               patientGroup == "AB+";
    }

    if (donorGroup == "B+")
    {
        return patientGroup == "B+" ||
               patientGroup == "AB+";
    }

    if (donorGroup == "AB-")
    {
        return patientGroup == "AB-" ||
               patientGroup == "AB+";
    }

    if (donorGroup == "AB+")
    {
        return patientGroup == "AB+";
    }

    return false;
}

int DonorMatching::compatibilityScore(string donorGroup,
                                       string patientGroup) const
{
    if (!isCompatible(donorGroup, patientGroup))
    {
        return 0;
    }

    if (donorGroup == patientGroup)
    {
        return 50;
    }

    return 40;
}

int DonorMatching::distanceScore(int distance) const
{
    int score = 20 - (distance / 5);

    if (score < 0)
    {
        score = 0;
    }

    if (score > 20)
    {
        score = 20;
    }

    return score;
}

int DonorMatching::calculateMatchScore(const Donor& donor,
                                        string patientBloodGroup,
                                        int urgencyScore) const
{
    int compatibility = compatibilityScore(
        donor.getBloodGroup(),
        patientBloodGroup
    );

    int availability = donor.isAvailable() ? 20 : 0;

    int distance = distanceScore(
        donor.getDistance()
    );

    if (urgencyScore < 0)
    {
        urgencyScore = 0;
    }

    if (urgencyScore > 100)
    {
        urgencyScore = 100;
    }

    int urgency = urgencyScore / 10;

    int totalScore = compatibility +
                     availability +
                     distance +
                     urgency;

    return totalScore;
}

bool DonorMatching::findBestDonor(const DonorHashTable& donorTable,
                                   string patientBloodGroup,
                                   int urgencyScore,
                                   Donor& bestDonor,
                                   int& bestScore) const
{
    vector<string> bloodGroups =
    {
        "O-",
        "O+",
        "A-",
        "A+",
        "B-",
        "B+",
        "AB-",
        "AB+"
    };

    bool found = false;

    bestScore = -1;

    for (const string& group : bloodGroups)
    {
        vector<Donor> candidates =
            donorTable.searchByBloodGroup(group);

        for (const Donor& donor : candidates)
        {
            if (!donor.isAvailable())
            {
                continue;
            }

            if (!donor.isEligible())
            {
                continue;
            }

            if (!isCompatible(donor.getBloodGroup(),
                              patientBloodGroup))
            {
                continue;
            }

            int currentScore =
                calculateMatchScore(
                    donor,
                    patientBloodGroup,
                    urgencyScore
                );

            if (!found || currentScore > bestScore)
            {
                bestDonor = donor;
                bestScore = currentScore;
                found = true;
            }
        }
    }

    return found;
}