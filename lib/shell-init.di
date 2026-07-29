# Dirac Shell Init Script
# This script runs automatically when the shell starts

# Auto-index user's saved subroutines for search functionality
#<index-subroutines path="~/.dirac/lib/user" />

# Load native tags for tab completion and AI helper subroutines
|import src="./native-tags.di" >

|import src="./ai.di" >

# Define some useful helper subroutines
#<hello |
#  |output>Hello from init script!

#<greet name=String |
#  |output>Hello, |variable name=name>!

# Uncomment to see available subroutines on startup
#|list-subroutines format=braket>
