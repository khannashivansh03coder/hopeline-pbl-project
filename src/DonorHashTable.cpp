#include "../include/DonorHashTable.h"

#include <iostream>

using namespace std;

DonorHashTable::DonorHashTable(int size)
{
    tableSize = size;
    table.resize(tableSize);
}

int DonorHashTable::hashFunction(string bloodGroup) const
{
    int hashValue = 0;

    for (char ch : bloodGroup)
    {
        hashValue = (hashValue * 31 + ch) % tableSize;
    }

    return hashValue;
}

void DonorHashTable::insert(Donor donor)
{
    int index = hashFunction(donor.getBloodGroup());

    table[index].push_back(donor);
}

vector<Donor> DonorHashTable::searchByBloodGroup(string bloodGroup) const
{
    vector<Donor> result;

    int index = hashFunction(bloodGroup);

    for (const Donor& donor : table[index])
    {
        if (donor.getBloodGroup() == bloodGroup)
        {
            result.push_back(donor);
        }
    }

    return result;
}

void DonorHashTable::display() const
{
    cout << "\n========== DONOR HASH TABLE ==========\n";

    for (int i = 0; i < tableSize; i++)
    {
        cout << "Bucket " << i << " : ";

        if (table[i].empty())
        {
            cout << "Empty";
        }
        else
        {
            for (const Donor& donor : table[i])
            {
                cout << donor.getDonorId()
                     << "(" << donor.getBloodGroup() << ") ";
            }
        }

        cout << endl;
    }

    cout << "======================================\n";
}

int DonorHashTable::size() const
{
    int count = 0;

    for (const vector<Donor>& bucket : table)
    {
        count += bucket.size();
    }

    return count;
}