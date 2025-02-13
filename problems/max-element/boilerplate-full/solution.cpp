#include <iostream>
#include <vector>
#include <string>

int maxElement(std::vector<int> arr) {
    // Implementation goes here
    return result;
}

int main() {
    int size_arr;
    std::cin >> size_arr;
    std::vector<int> arr(size_arr);
    for(int i = 0; i < size_arr; ++i) std::cin >> arr[i];

    int result = maxElement(arr);
    std::cout << result << std::endl;
    return 0;
}
