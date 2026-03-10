# Dirac Shell Init Script
# This script runs automatically when the shell starts

# Define some useful helper subroutines
<hello |
  |output>Hello from init script!

<greet name=String |
  |output>Hello, |variable name=name>!

# Uncomment to see available subroutines on startup
# |list-subroutines format=braket>
