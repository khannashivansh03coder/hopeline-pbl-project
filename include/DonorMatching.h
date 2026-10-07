#ifndef DONORMATCHING_H
#define DONORMATCHING_H

#include "Donor.h"
#include "DonorHashTable.h"

#include <string>

using namespace std;

class DonorMatching
{
private:
    bool isCompatible(string donorGroup,
                      string patientGroup) const;

    int compatibilityScore(string donorGroup,
                           string patientGroup) const;

    int distanceScore(int distance) const;

public:
    int calculateMatchScore(const Donor& donor,
                            string patientBloodGroup,
                            int urgencyScore) const;

    bool findBestDonor(const DonorHashTable& donorTable,
                       string patientBloodGroup,
                       int urgencyScore,
                       Donor& bestDonor,
                       int& bestScore) const;
};

#endif