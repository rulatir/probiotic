include macros/Makefile.module.pb

# Build (fake) archive from objects
templating.a: foo/foo.o bar/bar.o
	cat $^ > $@

# Expand the MODULE_BUILD template to emit rules for building object foo
MODULE§ = foo
$(MODULE_BUILD§)

# Expand the MODULE_BUILD template to emit rules for building object bar
MODULE§ = bar
$(MODULE_BUILD§)
