"""Line break extension to create elegant line breaks on demand"""

from typing import Dict, List

from docutils import nodes
from sphinx.application import Sphinx
from sphinx.util import logging
from sphinx.util.docutils import SphinxDirective, SphinxTranslator

logger = logging.getLogger(__name__)


class line_break_node(nodes.General, nodes.Element):
    """line break node"""

    pass


class LineBreak(SphinxDirective):
    """line break directive

    Example::
    .. line-break::
    """

    has_content = False
    required_arguments = 0
    optional_arguments = 0
    final_argument_whitespace = False
    option_spec = {}

    def run(self) -> List[line_break_node]:
        return [line_break_node()]


def visit_line_break_node_html(
    translator: SphinxTranslator, node: line_break_node
) -> None:
    """Entry point of the html line break node"""

    translator.body.append("<br/><br/><br/>")


def depart_line_break_node_html(*args) -> None:
    """Exit point of the ignored line break node."""
    pass


def visit_line_break_node_unsuported(
    translator: SphinxTranslator, node: line_break_node
) -> None:
    """Entry point of the ignored logo node."""
    logger.warning("Logo: unsupported output format (node skipped)")
    raise nodes.SkipNode


def setup(app: Sphinx) -> Dict[str, bool]:
    app.add_node(
        line_break_node,
        html=(visit_line_break_node_html, depart_line_break_node_html),
        epub=(visit_line_break_node_unsuported, None),
        latex=(visit_line_break_node_unsuported, None),
        man=(visit_line_break_node_unsuported, None),
        texinfo=(visit_line_break_node_unsuported, None),
        text=(visit_line_break_node_unsuported, None),
    )
    app.add_directive("line-break", LineBreak)

    return {
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
