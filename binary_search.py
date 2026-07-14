def binary_search(arr, target):
    low, high = 0, len(arr) - 1

    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1

    return -1


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 2:
        target = sys.argv[-1]
        data = sys.argv[1:-1]
        try:
            data = [int(x) for x in data]
            target = int(target)
        except ValueError:
            pass
        arr = sorted(data)
        print(f"Array:  {arr}")
        print(f"Target: {target}")
        index = binary_search(arr, target)
        if index != -1:
            print(f"Found at index {index}")
        else:
            print("Not found")
    else:
        arr = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
        print(f"Array: {arr}")
        for target in [7, 1, 19, 6]:
            index = binary_search(arr, target)
            if index != -1:
                print(f"  {target} -> found at index {index}")
            else:
                print(f"  {target} -> not found")
