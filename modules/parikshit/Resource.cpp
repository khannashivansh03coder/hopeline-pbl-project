#include "Resource.h"
#include <iostream>

Resource::Resource(int id, const std::string& type)
    : id(id), type(type), state(ResourceState::AVAILABLE) {}

int Resource::getId() const {
    return id;
}

std::string Resource::getType() const {
    return type;
}

ResourceState Resource::getState() const {
    return state;
}

void Resource::occupy() {
    state = ResourceState::OCCUPIED;
}

void Resource::release() {
    state = ResourceState::AVAILABLE;
}

void Resource::reserve() {
    state = ResourceState::RESERVED;
}

GeneralBed::GeneralBed(int id)
    : Resource(id, "General Bed") {}

void GeneralBed::display() const {
    std::cout << "General Bed | ID: " << id << std::endl;
}

ICUBed::ICUBed(int id)
    : Resource(id, "ICU Bed") {}

void ICUBed::display() const {
    std::cout << "ICU Bed | ID: " << id << std::endl;
}

OxygenUnit::OxygenUnit(int id)
    : Resource(id, "Oxygen Unit") {}

void OxygenUnit::display() const {
    std::cout << "Oxygen Unit | ID: " << id << std::endl;
}
