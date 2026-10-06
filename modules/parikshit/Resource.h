#ifndef RESOURCE_H
#define RESOURCE_H

#include <string>

enum class ResourceState {
    AVAILABLE,
    OCCUPIED,
    RESERVED
};

class Resource {
protected:
    int id;
    std::string type;
    ResourceState state;

public:
    Resource(int id, const std::string& type);
    virtual ~Resource() = default;

    int getId() const;
    std::string getType() const;
    ResourceState getState() const;

    void occupy();
    void release();
    void reserve();

    virtual void display() const = 0;
};

class GeneralBed : public Resource {
public:
    GeneralBed(int id);
    void display() const override;
};

class ICUBed : public Resource {
public:
    ICUBed(int id);
    void display() const override;
};

class OxygenUnit : public Resource {
public:
    OxygenUnit(int id);
    void display() const override;
};

#endif
