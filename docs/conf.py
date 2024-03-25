# Configuration file for the Sphinx documentation builder.
import sys
from pathlib import Path

sys.path.append(str(Path(".").resolve()))

# -- Project information
project = "Openforis Arena"
copyright = "2024, Openforis Arena"
author = "Openforis Arena"

# -- General configuration ---------------------------------------------------
extensions = [
    "sphinx.ext.napoleon",
    "sphinx.ext.graphviz",
    "sphinxcontrib.images",
    "sphinxcontrib.icon",
    "sphinxcontrib.btn",
    "sphinxcontrib.email",
    "sphinx_design",
    "sphinx_togglebutton",
    "sphinx_favicon",
    "sphinx_last_updated_by_git",
    "notfound.extension",
    "_extentions.line_break",
    # "_extentions.custom_edit",
    # "_extentions.logos",
]

templates_path = ["_templates"]
exclude_patterns = ["**.ipynb_checkpoints"]
locale_dirs = ["_locale/"]
gettext_compact = False
language = "en"

# -- Options for HTML output ---------------------------------------------------

templates_path = ["_templates"]
html_theme = "pydata_sphinx_theme"
html_last_updated_fmt = None
html_sidebars = {"index": []}
html_static_path = ["_static"]

html_theme_options = {
    "logo": {
        "image_light": "_static/main.png",
        "image_dark": "_static/main.png",
    },
    "header_links_before_dropdown": 7,
    "navigation_with_keys": False,
    "show_nav_level": 1,
    "show_prev_next": True,
    "icon_links": [
        {
            "name": "GitHub",
            "url": "github.com:openforis/arena",
            "icon": "fa-brands fa-github",
        },
    ],
    "article_footer_items": ["last-updated"],
    "footer_start": ["copyright", "sphinx-version"],
}

# -- Option for Latex output ---------------------------------------------------

youtube_cmd = (
    r"\newcommand{\sphinxcontribyoutube}[3]{\begin{figure}\sphinxincludegraphics{{#2}.jpg}\caption{\url{#1#2#3}}\end{figure}}"
    + "\n"
)
vimeo_cmd = (
    r"\newcommand{\sphinxcontribvimeo}[3]{\begin{figure}\sphinxincludegraphics{{#2}.jpg}\caption{\url{#1#2#3}}\end{figure}}"
    + "\n"
)

latex_elements = {"preamble": youtube_cmd + vimeo_cmd}
