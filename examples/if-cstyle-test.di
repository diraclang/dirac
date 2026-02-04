<dirac>
  <output>===== C-Style IF with cond/then/else =====</output>
  <output>
</output>
  
  <!-- Test 1: Simple condition with cond eval -->
  <output>Test 1: Simple equality test</output>
  <defvar name="x" value="5"/>
  
  <if>
    <cond eval="eq">
      <arg><variable name="x"/></arg>
      <arg>5</arg>
    </cond>
    <then>
      <output>x equals 5 (correct!)</output>
    </then>
    <else>
      <output>x does not equal 5 (wrong!)</output>
    </else>
  </if>
  <output>
</output>
  
  <!-- Test 2: Less than comparison -->
  <output>Test 2: Less than comparison</output>
  <defvar name="a" value="3"/>
  
  <if>
    <cond eval="lt">
      <arg><variable name="a"/></arg>
      <arg>10</arg>
    </cond>
    <then>
      <output>a is less than 10 (correct!)</output>
    </then>
    <else>
      <output>a is not less than 10 (wrong!)</output>
    </else>
  </if>
  <output>
</output>
  
  <!-- Test 3: Not equal -->
  <output>Test 3: Not equal test</output>
  <defvar name="status" value="active"/>
  
  <if>
    <cond eval="ne">
      <arg><variable name="status"/></arg>
      <arg>inactive</arg>
    </cond>
    <then>
      <output>Status is not inactive (correct!)</output>
    </then>
    <else>
      <output>Status is inactive (wrong!)</output>
    </else>
  </if>
  <output>
</output>
  
  <!-- Test 4: Greater than or equal -->
  <output>Test 4: Greater than or equal</output>
  <defvar name="age" value="18"/>
  
  <if>
    <cond eval="ge">
      <arg><variable name="age"/></arg>
      <arg>18</arg>
    </cond>
    <then>
      <output>Age is 18 or older (correct!)</output>
    </then>
    <else>
      <output>Age is under 18 (wrong!)</output>
    </else>
  </if>
  <output>
</output>
  
  <!-- Test 5: Condition without eval (predicate style) -->
  <output>Test 5: Simple predicate (non-empty is true)</output>
  <defvar name="name" value="Alice"/>
  
  <if>
    <variable name="name"/>
    <then>
      <output>Name exists: <variable name="name"/></output>
    </then>
    <else>
      <output>Name is empty</output>
    </else>
  </if>
  <output>
</output>
  
  <!-- Test 6: False condition -->
  <output>Test 6: False condition (should go to else)</output>
  <defvar name="count" value="0"/>
  
  <if>
    <cond eval="eq">
      <arg><variable name="count"/></arg>
      <arg>10</arg>
    </cond>
    <then>
      <output>Count is 10 (wrong!)</output>
    </then>
    <else>
      <output>Count is not 10 (correct!)</output>
    </else>
  </if>
  <output>
</output>
  
  <!-- Test 7: Only then block (no else) -->
  <output>Test 7: If without else block</output>
  <defvar name="enabled" value="true"/>
  
  <if>
    <output>true</output>
    <then>
      <output>Feature is enabled</output>
    </then>
  </if>
  <output>
</output>
  
  <!-- Test 8: Using <do> instead of <then> -->
  <output>Test 8: Using do instead of then</output>
  
  <if>
    <cond eval="same">
      <arg>hello</arg>
      <arg>hello</arg>
    </cond>
    <do>
      <output>Strings match (correct!)</output>
    </do>
    <else>
      <output>Strings don't match (wrong!)</output>
    </else>
  </if>
  <output>
</output>
  
  <output>===== All C-style IF tests complete =====</output>
</dirac>
