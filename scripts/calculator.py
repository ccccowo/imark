def add_numbers(a, b):
    result = float(a) + float(b)
    print(result)  # 这会被Node.js捕获
    return result

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2:
        add_numbers(sys.argv[1], sys.argv[2]) 