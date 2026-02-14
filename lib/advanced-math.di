<dirac>

<subroutine name="MATH_SQRT">
  <eval>
    const caller = getParams();
    const n = parseFloat(caller.attributes.n || 0);
    if (n &lt; 0) {
      console.log('NaN');
      return;
    }
    let x = n;
    let prev;
    do {
      prev = x;
      x = (x + n / x) / 2;
    } while (Math.abs(x - prev) &lt; 1e-10);
    console.log(x);
  </eval>
</subroutine>

<subroutine name="MATH_STATS">
  <eval>
    const caller = getParams();
    const dataStr = caller.attributes.data || '[]';
    const data = JSON.parse(dataStr);
    if (data.length === 0) { console.log('{}'); return; }
    const sum = data.reduce((a, b) =&gt; a + b, 0);
    const mean = sum / data.length;
    const variance = data.reduce((acc, x) =&gt; acc + Math.pow(x - mean, 2), 0) / data.length;
    const stddev = Math.sqrt(variance);
    const sorted = [...data].sort((a, b) =&gt; a - b);
    const median = data.length % 2 === 0 ? (sorted[data.length/2 - 1] + sorted[data.length/2]) / 2 : sorted[Math.floor(data.length/2)];
    const stats = { count: data.length, sum: sum, mean: mean, median: median, stddev: stddev, min: sorted[0], max: sorted[sorted.length - 1] };
    console.log(JSON.stringify(stats, null, 2));
  </eval>
</subroutine>

<subroutine name="MATH_RANDOM">
  <eval>
    const caller = getParams();
    const min = parseFloat(caller.attributes.min || 0);
    const max = parseFloat(caller.attributes.max || 1);
    const random = Math.random() * (max - min) + min;
    console.log(random);
  </eval>
</subroutine>

<subroutine name="MATH_FACTORIAL">
  <eval>
    const caller = getParams();
    const n = parseInt(caller.attributes.n || 0);
    function factorial(x) { if (x &lt;= 1) return 1; return x * factorial(x - 1); }
    console.log(factorial(n));
  </eval>
</subroutine>

<subroutine name="MATH_GCD">
  <eval>
    const caller = getParams();
    const a = parseInt(caller.attributes.a || 0);
    const b = parseInt(caller.attributes.b || 0);
    function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); }
    console.log(gcd(Math.abs(a), Math.abs(b)));
  </eval>
</subroutine>

<subroutine name="MATH_PRIME">
  <eval>
    const caller = getParams();
    const n = parseInt(caller.attributes.n || 0);
    if (n &lt;= 1) { console.log(0); return; }
    if (n &lt;= 3) { console.log(1); return; }
    if (n % 2 === 0 || n % 3 === 0) { console.log(0); return; }
    for (let i = 5; i * i &lt;= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) { console.log(0); return; }
    }
    console.log(1);
  </eval>
</subroutine>

</dirac>
