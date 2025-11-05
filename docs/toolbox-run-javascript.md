https://toolboxdocs.netlify.app/run-js#runjs

# Run Javascript

Runs the supplied text and parameters as JavaScript.

## Overview

Run JavaScript is a client-side workflow action in Bubble, executed within a page workflow step.

## Setting Properties

- **Script**: Executes as JavaScript.
- **Asynchronous**: Runs script in a `setTimeout` function. Typically, no noticeable difference for most use cases.
- **param1 to param5**: Accessible in the script as `properties.param1`, etc.
- **paramlist1 to paramlist5**: Similar to `param1`, but in list form.

## Bubble Data Types as Parameters

### Single Parameter
When `param1` is set to a Bubble data type (e.g., `Search for Fruits:first item`):

```javascript
console.log(properties.param1.listProperties());
// ['name_text', 'overripe_color_option_color', 'ripe_color_option_color', 'unripe_color_option_color', 'Created By', 'Slug', 'Created Date', 'Modified Date', '_id']

console.log(properties.param1.get('name_text'));
// 'Banana'

var overripe = properties.param1.get('overripe_color_option_color');
console.log(overripe.listProperties());
// ['display']

console.log(overripe.get('display'));
// 'Black'
```

### Parameter List
When `paramlist1` is set to a list of Bubble data types (e.g., `Search for Fruits`):

```javascript
var len = properties.paramlist1.length();
var mylist = properties.paramlist1.get(0, len);
console.log(mylist);
// Array of Bubble data types
```

## Resulting Value

Run JavaScript has no direct Bubble outputs. To return a result to Bubble, use a JavaScript to Bubble element:

```javascript
var singularNumber = Math.sin(Math.PI / 2);
bubble_fn_calcresult(singularNumber);
```

## Dynamic Data

Bubble fills in dynamic data before running the script. If the script modifies dynamic data used within it, the script uses the original values.

Example with `param1` set to `js2b fruit's value`:

```javascript
bubble_fn_fruit("apple");
console.log("fruit?", properties.param1);
// Outputs the value of fruit before the script ran
```

To access updated values:
1. Enable "Trigger event" in the action.
2. Start a new workflow from `js2b fruit event`.
3. Use a new Run JavaScript action with `param1` set to `js2b fruit's value`:

```javascript
console.log("fruit?", properties.param1);
// Outputs "apple"
```

## Parameter Examples

### Single Parameter
`param1`: `Arbitrary text "hello"`

```javascript
console.log("my text", properties.param1);
// Outputs "hello"
```

### Parameter List
`paramlist1`: `List of Numbers A's list`

```javascript
var len = properties.paramlist1.length();
var mylist = properties.paramlist1.get(0, len);
console.log("my list", mylist);
// Outputs [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

### Bubble Data
`param1`: `Current User`

```javascript
console.log('listProperties: ', properties.param1.listProperties());
var mydate = properties.param1.get('Created Date');
console.log('mydate', mydate);
// Outputs user's creation date
```

`paramlist1`: `Current User:converted to list`

```javascript
var len = properties.paramlist1.length();
var mylist = properties.paramlist1.get(0, len);
var mydates = mylist.map(item => item.get('Created Date'));
console.log('mydates',=mydates);
// Outputs list of dates
```

## Localization

Bubble automatically converts dynamic data to text based on the local language. For better JavaScript compatibility, explicitly convert data using Bubble's `:format as text` operator to:
- Convert yes/no to true/false.
- Format numbers with `.` as the decimal separator and no thousand separator.

This is not required for parameters.

# Javascript to Bubble

Creates a function that sends JavaScript parameters to Bubble for dynamic data or to trigger workflow events.

## Setup
Place the element on the page, ensuring it is visible to load properties. Resize to minimal size to keep out of the way.

## Properties
- **bubble_fn_suffix**: Set a text to create a global JavaScript function (`bubble_fn_<suffix>`) to send data to Bubble.
- **Trigger event**: Triggers a page workflow event to initiate a workflow.
- **Publish value**: Passes the parameter as the element's value or value list.
- **Queue**: Queues second and subsequent events/values. Use `Dequeue` action to process.
- **Multiple Outputs**: Sends multiple data types via an object with properties matching output names.
- **Value type**: Specifies the output data type.
- **Value is a list**: Outputs to value list instead of single value.
- **output1 type** to **output4 type**: Defines types for outputs.
- **outputlist1 type** to **outputlist4 type**: Defines types for list outputs.

## Element Actions
- **Dequeue**: Moves queued value to current, triggers event. Clears current value if queue is empty.
- **ClearQueue**: Clears queue and current value (if queue enabled).

## Dynamic Suffix
For multiple instances (e.g., in Repeating Groups or reusable elements), use dynamic data for unique suffixes, like `current cell's index`.

## Queue Event and Value
- Value is independent of trigger event.
- Use queue to align events with values.
- Run `Dequeue` in a workflow to process next value and trigger event.

## Multiple Outputs Example
Set `output1 type` to text, `output2 type` to number:
```javascript
bubble_fn_fruit_count({output1: "apple", output2: 69});
```

## Example JavaScript
```javascript
bubble_fn_fruit("apple");
bubble_fn_fruitbasket(["apple", "banana", "fruitfly"]);
bubble_fn_count(876);
bubble_fn_book(bubble_data);
bubble_fn_books([bubble_data, bubble_data2]);
bubble_fn_book("id-of-bubble-data"); // Looks up Bubble data by ID (undocumented, may change).
```

## Notes
- **Do not hide the element**: Hidden elements can't read properties, preventing `bubble_fn_suffix` creation.