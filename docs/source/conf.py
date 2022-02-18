# Configuration file for the Sphinx documentation builder.
#
# This file only contains a selection of the most common options. For a full
# list see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

from datetime import datetime


# -- Project information -------------------------------------------------------

project = "Arena"
copyright = f"2018-{datetime.now().year}, Open Foris"
author = "Open Foris"
release = "1.0.24"

# -- General configuration -----------------------------------------------------

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = [
    "notfound.extension"
]

# Add any paths that contain templates here, relative to this directory.
templates_path = ["_templates"]

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This pattern also affects html_static_path and html_extra_path.
exclude_patterns = ["**.ipynb_checkpoints"]


# -- Options for HTML output ---------------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
#
html_theme = "pydata_sphinx_theme"

# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the builtin "default.css".
html_static_path = ["_static"]

# These paths are either relative to html_static_path
# or fully qualified paths (eg. https://...)
html_css_files = ["css/custom.css"]

# -- Pydata-sphinx-theme parameters --------------------------------------------

# A complete description of the theme can be found on their documentation: 
# https://pydata-sphinx-theme.readthedocs.io/en/latest/index.html

html_favicon = "_static/img/favicon.ico"

html_logo = "_static/img/arena-logo.png"

html_theme_options = {
    "show_prev_next": False,
    "icon_links": [
        {
            "name": "GitHub",
            "url": "https://github.com/openforis/arena",
            "icon": "fab fa-github"
        },
        {
            "name": "Twitter",
            "url": "https://twitter.com/OpenForis",
            "icon": "fab fa-twitter"
        },
        {
             "name": "Website",
            "url": "https://www.openforis-arena.org/app/home/",
            "icon": "fas fa-globe"
        }
    ],
    "use_edit_page_button": True,
    "footer_items": ["copyright", "sphinx-version", "license"]
}

html_context = {
    "github_user": "openforis",
    "github_repo": "arena",
    "github_version": "master",
    "doc_path": "docs/source"
}

# -- Options for images -------------------------------------------------------

images_config = {
    "download": False
}