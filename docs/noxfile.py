"""All the process that can be run using nox.

The nox run are build in isolated environment that will be stored in .nox. to force the venv update, remove the .nox/xxx folder.
"""

import nox

nox.options.sessions = ["docs"]


@nox.session(reuse_venv=True)
def lint(session):
    """Apply the pre-commits."""
    session.install("pre-commit")
    session.run("pre-commit", "run", "--a", *session.posargs)


@nox.session(reuse_venv=True)
def docs(session):
    """Build the documentation."""
    session.install("-r", "requirements.txt")

    # build the documentation
    source = "."
    html = "_build/html"
    session.run("sphinx-build", "-b", "html", source, html, "-w", "warnings.txt")

    # check for untracked documentation warnings
    session.run("python", "tests/check_warnings.py")
