Custom instructions
===================

Introduction
------------

The :code:`doc` has a fixed structure that needs to be respected to stay inline withe Sphinx builder requirements. All modification should be made in the :code:`docs/source/` folder and the images associated with a page should live in the corresponding folder in :code:`sepal-doc/docs/source/_static/img/`.

If some of the files are misplaced there build into html pages cannot be guaranteed. Please respect the following instructions when you consider making changes to the repository. 

Tools
^^^^^

The work of the :code:`docs/` folder is to create .rst files in an ordered way. To do that will will use at it's maximum the potential of the Python `Sphinx <https://www.sphinx-doc.org/en/master/>`__ library (to create the build) and the `ReadTheDoc <https://readthedocs.org>`__ website (to distribute the build).

.. warning::

    To work on this project you will need the following:

    - basic knowledge of any lightweight markup language ( markdown, latex, etc..) that will help you understand .rst
    - the `Sphinx directives documentation <https://www.sphinx-doc.org/en/master/usage/restructuredtext/directives.html>`_
    - a GitHub account 
    - basic understanding of terminal commands 

Guidelines
^^^^^^^^^^

There are very few guidelines to respect that are not directly specified by the .rst documentation or the template. 

-    In all the files you write please respect the following indentation: :code:`4 spaces`. it includes directives (option and content) AND bullet points
-    For the headings of your files use the following symbols (from heading 1 to heading 6) :code:`=`, :code:`-`, :code:`^`, :code:`"`, :code:`#`, :code:`+`. If not respected then the latex build will be funny.

Custom directives and roles
^^^^^^^^^^^^^^^^^^^^^^^^^^^

Here you will find the custom directives that have been added to help us build our documentation: 

videos
""""""

ReST directive for embedding Youtube and Vimeo videos (https://github.com/sphinx-contrib/youtube).
There are two directives added: :code:`youtube` and :code:`vimeo`. The only argument is the video id of the video to include.
Both directives have three optional arguments: 
- :code:`height`, 
- :code:`width`,
- :code:`align`

Default height is **281** and default width is **500**. By default the video will be aligned on the **left** side.

Here you'll find an example: 

.. code-block:: rst 

    .. youtube:: Ub6N8aWThw4
        :height: 315
        :width: 560

.. youtube:: Ub6N8aWThw4
    :height: 315
    :width: 560

icon
""""

ReST role to include inline icons in the documenation (https://sphinx-icon.readthedocs.io/en/latest/?badge=latest). You can find the icon you're looking for in the fontawesome library `page <https://fontawesome.com/v5.15/icons?d=gallery&p=2>`__. (

.. code-block:: rst 

    I'm a folder icon: :icon:`fa fa-folder`

I'm a folder icon: :icon:`fa fa-folder`

btn
"""

Rest role to include complete btn in the documentation (https://sphinx-btn.readthedocs.io/en/latest/?badge=latest). You can find the icon you're looking for in the fontawesome library `page <https://fontawesome.com/v5.15/icons?d=gallery&p=2>`__. The text is optional.

.. code-block:: rst 

    I'm a apply btn: :btn:`<fas fa-check> apply`

    I'm the app btn: :btn:`<fas fa-wrench>`

I'm a apply btn: :btn:`<fas fa-check> apply`

I'm the app btn: :btn:`<fas fa-wrench>`

image
"""""

We decided to include a lib to overwrite the image directive. With this extention, image can be zoomed-in using the fantastic lightbox javascript solution. nothing to change from your side simply avoid the :code:`target` parameter in your image and forget about the `figure` directive (because it cannot be overwritten). Documentation can be found here: https://sphinxcontrib-images.readthedocs.io/en/latest/. You can use the :code:`group` option to navigate between images using the keyboard arrows.


.. code-block:: rst 

    .. image:: http://upload.wikimedia.org/wikipedia/meta/0/08/Wikipedia-logo-v2_1x.png
        :width: 30%
        :group: toto

    .. image:: http://upload.wikimedia.org/wikipedia/meta/0/08/Wikipedia-logo-v2_1x.png
        :width: 30%
        :group: toto

.. image:: http://upload.wikimedia.org/wikipedia/meta/0/08/Wikipedia-logo-v2_1x.png
    :width: 30%
    :group: toto

.. image:: http://upload.wikimedia.org/wikipedia/meta/0/08/Wikipedia-logo-v2_1x.png
    :width: 30%
    :group: toto


