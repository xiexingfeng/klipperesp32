# The following lines of boilerplate have to be in your project's CMakeLists
# in this exact order for cmake to work correctly
cmake_minimum_required(VERSION 3.16)

# set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -flto -fwhole-program -fno-use-linker-plugin -ggdb3")


set(EXTRA_COMPONENT_DIRS "src")
include($ENV{IDF_PATH}/tools/cmake/project.cmake)
project(klipperesp32)


