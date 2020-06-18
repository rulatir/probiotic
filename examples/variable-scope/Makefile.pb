# Assign to an §-variable
MODULE§ = foo

# Include a file that uses the §-variable
include $(MODULE§)/Makefile.pb

# Reassign the variable
MODULE§ = bar

# Include another file that uses it
include $(MODULE§)/Makefile.pb
