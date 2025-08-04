#include <iostream>
#include "manyjson.h"

int main()
{
    std::cout << "ManyJson - Keep your JSON files together and show their relationships." << std::endl;

    manyjson::JsonManager manager;
    std::cout << "JsonManager initialized successfully!" << std::endl;

    return 0;
}