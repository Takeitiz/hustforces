import java.util.Scanner;

public class Solution {

    ##USER_CODE_HERE##

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        int num1 = scanner.nextInt();
        int num2 = scanner.nextInt();

        int result = sum(num1, num2);
        System.out.println(result);
        scanner.close();
    }
}
