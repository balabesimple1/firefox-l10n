"""
Sorting Algorithm Examples
==========================
A collection of common sorting algorithms implemented in Python,
with time and space complexity annotations.
"""

from typing import List


# ------------------------------------------------------------
# Bubble Sort  –  O(n²) time | O(1) space
# ------------------------------------------------------------

def bubble_sort(arr: List[int]) -> List[int]:
    """
    Repeatedly steps through the list, compares adjacent elements,
    and swaps them if they are in the wrong order.
    Optimised with an early-exit flag for already-sorted input.
    """
    arr = arr[:]
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr


# ------------------------------------------------------------
# Selection Sort  –  O(n²) time | O(1) space
# ------------------------------------------------------------

def selection_sort(arr: List[int]) -> List[int]:
    """
    Divides the list into a sorted and an unsorted region.
    On each pass it finds the minimum element in the unsorted
    region and moves it to the end of the sorted region.
    """
    arr = arr[:]
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr


# ------------------------------------------------------------
# Insertion Sort  –  O(n²) time | O(1) space
# ------------------------------------------------------------

def insertion_sort(arr: List[int]) -> List[int]:
    """
    Builds the sorted list one element at a time by inserting
    each new element into its correct position among the
    already-sorted elements.
    Efficient for small or nearly-sorted data.
    """
    arr = arr[:]
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr


# ------------------------------------------------------------
# Merge Sort  –  O(n log n) time | O(n) space
# ------------------------------------------------------------

def merge_sort(arr: List[int]) -> List[int]:
    """
    Divide-and-conquer algorithm that splits the list in half,
    recursively sorts each half, then merges the two sorted halves.
    Stable sort; preferred when stability matters.
    """
    if len(arr) <= 1:
        return arr[:]

    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return _merge(left, right)


def _merge(left: List[int], right: List[int]) -> List[int]:
    result: List[int] = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result


# ------------------------------------------------------------
# Quick Sort  –  O(n log n) average / O(n²) worst | O(log n) space
# ------------------------------------------------------------

def quick_sort(arr: List[int]) -> List[int]:
    """
    Divide-and-conquer algorithm that selects a pivot element and
    partitions the list so that elements less than the pivot come
    before it and elements greater come after.
    Uses the Lomuto partition scheme with the last element as pivot.
    """
    arr = arr[:]
    _quick_sort_helper(arr, 0, len(arr) - 1)
    return arr


def _partition(arr: List[int], low: int, high: int) -> int:
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1


def _quick_sort_helper(arr: List[int], low: int, high: int) -> None:
    if low < high:
        pivot_idx = _partition(arr, low, high)
        _quick_sort_helper(arr, low, pivot_idx - 1)
        _quick_sort_helper(arr, pivot_idx + 1, high)


# ------------------------------------------------------------
# Heap Sort  –  O(n log n) time | O(1) space
# ------------------------------------------------------------

def heap_sort(arr: List[int]) -> List[int]:
    """
    Converts the list into a max-heap, then repeatedly extracts
    the maximum element and places it at the end of the sorted
    region.  Not stable, but sorts in-place.
    """
    arr = arr[:]
    n = len(arr)

    for i in range(n // 2 - 1, -1, -1):
        _sift_down(arr, i, n)

    for end in range(n - 1, 0, -1):
        arr[0], arr[end] = arr[end], arr[0]
        _sift_down(arr, 0, end)

    return arr


def _sift_down(arr: List[int], root: int, end: int) -> None:
    while True:
        largest = root
        left = 2 * root + 1
        right = 2 * root + 2
        if left < end and arr[left] > arr[largest]:
            largest = left
        if right < end and arr[right] > arr[largest]:
            largest = right
        if largest == root:
            break
        arr[root], arr[largest] = arr[largest], arr[root]
        root = largest


# ------------------------------------------------------------
# Counting Sort  –  O(n + k) time | O(k) space
# ------------------------------------------------------------

def counting_sort(arr: List[int]) -> List[int]:
    """
    Non-comparison sort that works by counting the frequency of
    each value.  Efficient when the range of values (k) is not
    significantly larger than the number of elements (n).
    Only suitable for non-negative integers.
    """
    if not arr:
        return []
    max_val = max(arr)
    counts = [0] * (max_val + 1)
    for val in arr:
        counts[val] += 1
    result: List[int] = []
    for val, count in enumerate(counts):
        result.extend([val] * count)
    return result


# ------------------------------------------------------------
# Demo / smoke test
# ------------------------------------------------------------

def _run_demo() -> None:
    algorithms = {
        "Bubble Sort": bubble_sort,
        "Selection Sort": selection_sort,
        "Insertion Sort": insertion_sort,
        "Merge Sort": merge_sort,
        "Quick Sort": quick_sort,
        "Heap Sort": heap_sort,
        "Counting Sort": counting_sort,
    }

    sample = [64, 34, 25, 12, 22, 11, 90]
    expected = sorted(sample)

    print(f"Input:    {sample}")
    print(f"Expected: {expected}\n")

    for name, fn in algorithms.items():
        result = fn(sample)
        status = "OK" if result == expected else "FAIL"
        print(f"{name:<20} {status}  →  {result}")


if __name__ == "__main__":
    _run_demo()
