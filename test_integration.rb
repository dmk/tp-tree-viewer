#!/usr/bin/env ruby

# Add the lib directory to the load path
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), '..', 'lib'))

require 'tp_tree'

class TestClass
  def initialize(name)
    @name = name
  end

  def complex_calculation(numbers)
    result = 0
    numbers.each do |num|
      result += process_number(num)
    end
    format_result(result)
  end

  private

  def process_number(num)
    sleep(0.01) # Simulate some work
    squared = square(num)
    doubled = double(squared)
    doubled
  end

  def square(n)
    n * n
  end

  def double(n)
    n * 2
  end

  def format_result(result)
    "Result: #{result}"
  end
end

# Test the integration
puts "=== TP Tree + React Frontend Integration Test ==="
puts "This will generate JSON data that can be viewed in the React frontend"
puts

# Generate JSON output
TPTree.catch(json: true) do
  test_obj = TestClass.new("test")
  test_obj.complex_calculation([1, 2, 3, 4, 5])
end