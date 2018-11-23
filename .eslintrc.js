module.exports = {
    'parser': 'babel-eslint',
    'plugins': [
        'react'
    ],
    'extends': 'standard',
    'rules': {
        'comma-dangle': ['error', {
            'objects': 'always-multiline',
            'arrays': 'always-multiline',
            'imports': 'always-multiline',
            'exports': 'always-multiline',
        }],
        //'object-curly-spacing': ['error', 'never'],
        'object-curly-spacing': 'off',
        'curly': 'off',
        'padded-blocks': 'off',
        'eol-last': 'off',
        'spaced-comment': 'off',
        'no-multiple-empty-lines': 'off',
        indent: ['error', 2, {
            ignoredNodes: ['JSXElement', 'JSXElement > *', 'JSXAttribute', 'JSXIdentifier', 'JSXNamespacedName', 'JSXMemberExpression', 'JSXSpreadAttribute', 'JSXExpressionContainer', 'JSXOpeningElement', 'JSXClosingElement', 'JSXText', 'JSXEmptyExpression', 'JSXSpreadChild'],
        }],
        'react/jsx-indent': ['error', 2],
        'react/jsx-indent-props': [2, 'first'],
        'react/jsx-uses-vars': 1,
        'react/jsx-uses-react': 1,
    }

};