# probiotic
Probiotic is a simple preprocessor for evoldoers/biomake that works around certain GNU Make incompatibilities
of the latter tool and also provides a minimalistic templating capability.

### Preprocessing and running biomake

`probiotic` reads a `Makefile.pb`, writes preprocessed output to `Biomakefile` in the
same directory, and then invokes `biomake` passing the output file using the `-f` flag.

Simple invocation without arguments reads `Makefile.pb` in the current directory and invokes
`biomake` without specifying a goal, resulting in building the default goal.

`Biomakefile`s are regenerated upon every invocation of `probiotic`. Don't commit them to
version control.

### `§`-variables

`probiotic` has a rudimentary templating capability: it lets you define special variables that are expanded
during further preprocessing. 

The syntax to define them is similar to that of GNU Make's `=` definition, except the variable name
ends with the special sigil `§` (the section sign U+00A7, compose,s,o):

```makefile
SOME_VARIABLE§ = value
```

These variables can be referred to using the normal GNU Make variable reference syntax, including the § sign
that is considered to be part of the name:

```makefile
TOOL§ = my-favorite-tool --some-complicated-flag --another-complicated-flag

goal: file.in
    $(TOOL§) $^ > $@
```

The above gets transformed to:

```makefile

goal: file.in
    my-favorite-tool --some-complicated-flag --another-complicated-flag $^ > $@
```

### §-variable scope

During preprocessing, the `§`-variable assignments are executed imperatively in order of occurrence. The assigned
value is in effect for all subsequent usages in the same file and in files subsequently included from it. However,
reassignments in included file **do not** normally propagate to the including file: `include` introduces a scope.

See the example in `examples/variable-scope`.

### Templating

When performing a `§`-variable assignment, the right hand side is only minimally expanded; specifically,
only the recursive occurrences of the variable being reassigned are expanded, in an effort to avoid infinite
recursion. Other than that, the `§`-variable references in variable definitions remain unexpanded, which
makes rudimentary templating possible:  

See the example in `examples/templating`.

### Macro libraries

Preceding a `§`-variable definition with the `export` keyword causes the assignment to be propagated one level up,
to the directly including file. It will be in effect from the point where the that contains the `export`ed assignment
is `include`d. This is equivalent to the assignment being placed in the including file as a regular assignment without
the `export` keyword.

This makes it possible to move complicated template definitions to (a) separate file(s). Each such file must be
`include`d exactly once in a scope that contains all scopes in which the definition will be needed.

See the example in `examples/macro-library`, which is based on the templating example but moves template definitions
to a separate file. 
