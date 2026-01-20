```xml
<?xml version="1.0"?>
<!-- Basic Arithmetic Calculator -->
<dirac>
    <!-- Declaration of variables -->
    <defvar name="num1" value="0" />
    <defvar name="num2" value="0" />
    <defvar name="result" value="0" />
    <defvar name="operation" value="" />

    <!-- User input for first number -->
    <LLM output="num1">Please enter the first number:</LLM>
    
    <!-- User input for second number -->
    <LLM output="num2">Please enter the second number:</LLM>
    
    <!-- User input for the operation -->
    <LLM output="operation">Please choose the operation (+, -, *, /):</LLM>
    
    <!-- Perform selected operation -->
    <if test="${operation} == '+'">
        <set var="result" value="${num1} + ${num2}" />
    </if>
    <if test="${operation} == '-'">
        <set var="result" value="${num1} - ${num2}" />
    </if>
    <if test="${operation} == '*'">
        <set var="result" value="${num1} * ${num2}" />
    </if>
    <if test="${operation} == '/'">
        <if test="${num2} == 0">
            <output>Division by zero is not allowed.</output>
