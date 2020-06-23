# Define a template to emit the comment for a group of rules that build a module
MODULE_COMMENT§ = # $(MODULE§) build rules

# Define a template to emit a group of build rules for building a module; use the comment template defined above
MODULE_BUILD§ = \
$(MODULE_COMMENT§)\
\
# Build (fake) object $(MODULE§) \
$(MODULE§)/$(MODULE§).o:\
	echo "This is the $(MODULE§) object" > $@

# Build (fake) archive from objects
templating.a: foo/foo.o bar/bar.o
	cat $^ > $@

# Expand the MODULE_BUILD template to emit rules for building object foo
MODULE§ = foo
$(MODULE_BUILD§)

# Expand the MODULE_BUILD template to emit rules for building object bar
MODULE§ = bar
$(MODULE_BUILD§)
