#ifndef DONORHASHTABLE_H
#define DONORHASHTABLE_H

#include "Donor.h"
#include <vector>
#include <string>

using namespace std;

class DonorHashTable
{
private:
    vector<vector<Donor>> table;
    int tableSize;

    int hashFunction(string bloodGroup) const;

public:
    DonorHashTable(int size = 10);

    void insert(Donor donor);

    vector<Donor> searchByBloodGroup(string bloodGroup) const;

    void display() const;

    int size() const;
};

#endif