import java.util.Scanner;

public class Solution {

    public static int maxElement(int[] arr) {
    // Implementation goes here
    return result;
}

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        int size_arr = scanner.nextInt();
        int[] arr = new int[size_arr];
        for (int i = 0; i < size_arr; i++) {
            arr[i] = scanner.nextInt();
        }

        int result = maxElement(arr);
        System.out.println(result);
        scanner.close();
    }
}
