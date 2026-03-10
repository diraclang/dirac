<!-- Example: Using <schedule> for background tasks -->
<dirac>
  <defvar name="counter" value="0" />
  
  <!-- Schedule a task to run every 2 seconds -->
  <schedule interval="2" name="increment-counter">
    <assign name="counter">
      <expr eval="plus">
        <arg><variable name="counter" /></arg>
        <arg>1</arg>
      </expr>
    </assign>
    <output>[scheduled] Counter is now: <variable name="counter" /></output>
  </schedule>
  
  <output>Scheduled task started. Counter will increment every 2 seconds.</output>
  <output>Try: :tasks to see active tasks, :stop increment-counter to stop it.</output>
</dirac>