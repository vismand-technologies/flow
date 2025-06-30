import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

// These color values are extracted from the original Flow framework
// src/styles/base/_settings.sass and modules/_nodes.sass
const flowColors = {
  background: '#313638',
  nodeBg: '#1f2324',
  accent: '#ff7800',  // Main orange accent color
  border: '#222425',  // Darker than background
  text: {
    primary: '#ffffff',
    secondary: '#cccccc',
    disabled: '#888888',
    muted: '#777777',
  },
  link: {
    default: '#eeeeee',
    hover: '#ffffff',
  },
  node: {
    selected: '#252829',       // Slightly lighter than nodeBg
    selectedBorder: '#525557', // Significantly lighter for contrast
    selecting: '#1a1e1f',      // Slightly darker than nodeBg
    selectingBorder: '#424445',// Lighter for contrast
    fieldButton: '#555555',    // Connection point color
    fieldButtonHover: '#ffffff',// Hover state for connection points
    animation: '#ff0000',      // Animation highlight color (red)
  },
  connection: {
    default: '#646464',        // Connection line color (rgb(100,100,100))
    width: 1,                 // Connection line width
  }
};

// Consistent spacing and sizing based on original Flow framework
const flowSizing = {
  nodeFieldButton: '4px',     // Size of connection points
  nodeFieldPadding: '4px',    // Padding around node labels
  nodeBorderRadius: '4px',    // Border radius for nodes
  nodePadding: '4px',         // Internal padding in nodes
};

// Theme configuration that preserves the Flow visual language
export const flowThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: flowColors.accent,
    },
    secondary: {
      main: '#777777',
    },
    background: {
      default: flowColors.background,
      paper: flowColors.nodeBg,
    },
    text: {
      primary: flowColors.text.primary,
      secondary: flowColors.text.secondary,
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: "'Source Sans Pro', 'Helvetica Neue', Arial, Helvetica, sans-serif",
    fontSize: 14,
    // Monospace font for code blocks and technical content is defined in MuiCssBaseline below
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
      fontSize: '0.85rem', // For node titles which are smaller
    },
    body2: {
      fontSize: '0.75rem', // For node labels (matches the original 10-11px)
      color: flowColors.text.muted,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: flowColors.background,
          color: flowColors.text.primary,
        },
        code: {
          fontFamily: '"andale mono", "lucida console", monospace',
        },
        pre: {
          fontFamily: '"andale mono", "lucida console", monospace',
        },
        // Global utility classes for node width and ratio variations
        '.flow-width-80': {
          width: '80px',
        },
        '.flow-width-120': {
          width: '120px',
        },
        '.flow-width-150': {
          width: '150px',
        },
        '.flow-width-200': {
          width: '200px',
        },
        '.flow-width-230': {
          width: '230px',
        },
        // Node layout ratio classes
        '.flow-ratio-50-50': {
          '& .flow-node-inputs': {
            width: '50%',
          },
          '& .flow-node-outputs': {
            width: '50%',
          },
        },
        '.flow-ratio-80-20': {
          '& .flow-node-inputs': {
            width: '80%',
          },
          '& .flow-node-outputs': {
            width: '20%',
          },
        },
        '.flow-ratio-25-50-25': {
          '& .flow-node-inputs, & .flow-node-outputs': {
            width: '25%',
          },
          '& .flow-node-center': {
            width: '50%',
          },
        },
        // Connection styling
        '.flow-connection': {
          stroke: flowColors.connection.default,
          strokeWidth: flowColors.connection.width,
          fill: 'none',
          '&.flow-connection-animated': {
            stroke: flowColors.node.animation,
          },
        },
      },
    },
    // Node styling
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          '&.flow-node': {
            backgroundColor: flowColors.nodeBg,
            borderRadius: flowSizing.nodeBorderRadius,
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.2)',
            padding: flowSizing.nodePadding,
            border: '1px solid transparent',
            position: 'relative',
            minWidth: '80px',
            overflow: 'visible',
            '&.flow-node-selecting': {
              backgroundColor: flowColors.node.selecting,
              border: `1px solid ${flowColors.node.selectingBorder}`,
            },
            '&.flow-node-selected': {
              backgroundColor: flowColors.node.selected,
              border: `1px solid ${flowColors.node.selectedBorder}`,
            },
            '&.flow-node-has-animation': {
              boxShadow: `${flowColors.node.animation} 0 0 1px inset`,
            },
            // Connection points
            '& .flow-node-field': {
              cursor: 'pointer',
              display: 'inline-block',
              minWidth: '100%',
              minHeight: '16px',
              backgroundColor: 'transparent',
              color: flowColors.text.muted,
              lineHeight: '10px',
              '& .flow-field-connector': {
                display: 'inline-block',
                width: flowSizing.nodeFieldButton,
                height: flowSizing.nodeFieldButton,
                backgroundColor: flowColors.node.fieldButton,
                borderRadius: flowSizing.nodeFieldButton,
              },
              '&:hover': {
                color: flowColors.text.primary,
                '& .flow-field-connector': {
                  backgroundColor: flowColors.node.fieldButtonHover,
                },
              },
              '&.flow-field-target, &.flow-field-hover': {
                color: flowColors.accent,
                '& .flow-field-connector': {
                  backgroundColor: flowColors.accent,
                },
              },
            },
            // Node field positioning
            '& .flow-node-inputs': {
              display: 'inline',
              float: 'left',
              '& .flow-field-connector': {
                marginRight: flowSizing.nodeFieldPadding,
              },
            },
            '& .flow-node-outputs': {
              display: 'inline',
              float: 'right',
              '& .flow-field-connector': {
                marginLeft: flowSizing.nodeFieldPadding,
              },
            },
            // Node without inputs
            '&.flow-node-no-inputs': {
              '& .flow-node-inputs': {
                display: 'none',
                visibility: 'hidden',
              },
              '& .flow-node-outputs': {
                width: '100%',
              },
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: flowColors.nodeBg,
          borderRadius: '4px',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          '&:last-child': {
            paddingBottom: 16,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          textTransform: 'none',
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: `${flowColors.accent}e0`, // Slightly transparent on hover
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'hover',
      },
      styleOverrides: {
        root: {
          color: flowColors.link.default,
          '&:hover': {
            color: flowColors.link.hover,
          },
        },
      },
    },
    // Preserve spacing patterns for Stack component (our Grid replacement)
    MuiStack: {
      defaultProps: {
        spacing: 2,
      },
    },
    // SVG styling for connections
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          '&.flow-connection-path': {
            stroke: flowColors.connection.default,
            strokeWidth: flowColors.connection.width,
            fill: 'none',
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 4,
  },
  spacing: 8,
};

// Create and export the theme
const flowTheme = createTheme(flowThemeOptions);
export default flowTheme;
