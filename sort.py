def sort_and_print(items):
    sorted_items = sorted(items)
    for item in sorted_items:
        print(item)


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        data = sys.argv[1:]
        try:
            data = [int(x) for x in data]
        except ValueError:
            pass
        sort_and_print(data)
    else:
        sample = [5, 2, 8, 1, 9, 3, 7, 4, 6]
        print("Sorting:", sample)
        sort_and_print(sample)
