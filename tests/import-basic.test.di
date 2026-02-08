<!-- TEST: import_basic -->
<!-- EXPECT: 25 -->
<dirac>
  <import src="./examples/lib/math.di" />
  <call name="SQUARE" x="5" />
</dirac>
