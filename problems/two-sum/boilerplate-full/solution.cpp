#include <iostream>
#include <vector>
#include <string>

##USER_CODE_HERE##

int main() {
    int num1;
    std::cin >> num1;
    int num2;
    std::cin >> num2;

    int result = sum(num1, num2);
    std::cout << result << std::endl;
    return 0;
}
