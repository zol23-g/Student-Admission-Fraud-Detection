import dash
from dash import dcc, html, Input, Output, callback, dash_table, State
import plotly.express as px
import pandas as pd
import mysql.connector
from dash.exceptions import PreventUpdate
import dash_bootstrap_components as dbc
from datetime import date, datetime, timedelta

# Database connection configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'student'
}

# Initialize Dash app with Bootstrap theme
app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])

# Layout
app.layout = dbc.Container([
    # Header with title and logo
    dbc.Row([
        dbc.Col([
            html.Div([
                html.H1("Student Analytics Dashboard", 
                       className="text-center mt-4 mb-4",
                       style={'color': '#2c3e50', 'fontWeight': 'bold'}),
                html.P("Interactive visualization of student data", 
                      className="text-center text-muted mb-4")
            ], style={'borderBottom': '1px solid #ecf0f1', 'paddingBottom': '20px'})
        ], width=12)
    ]),
    
    # Control panel
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("Data Controls", className="bg-primary text-white"),
                dbc.CardBody([
                    dbc.Row([
                        dbc.Col([
                            dbc.Label("Select Columns"),
                            dcc.Dropdown(
                                id='column-selector',
                                options=[],
                                multi=True,
                                placeholder="Select columns...",
                                className="mb-3"
                            )
                        ], md=6),
                        dbc.Col([
                            dbc.Label("Chart Type"),
                            dcc.Dropdown(
                                id='chart-type',
                                options=[
                                    {'label': 'Bar Chart', 'value': 'bar'},
                                    {'label': 'Pie Chart', 'value': 'pie'},
                                    {'label': 'Scatter Plot', 'value': 'scatter'},
                                    {'label': 'Histogram', 'value': 'histogram'},
                                    {'label': 'Box Plot', 'value': 'box'},
                                    {'label': 'Line Chart', 'value': 'line'},
                                    {'label': 'Violin Plot', 'value': 'violin'}
                                ],
                                value='bar',
                                clearable=False,
                                className="mb-3"
                            )
                        ], md=6)
                    ]),
                    dbc.Row([
                        dbc.Col([
                            dbc.Label("Aggregation"),
                            dcc.Dropdown(
                                id='aggregation-selector',
                                options=[
                                    {'label': 'Count', 'value': 'count'},
                                    {'label': 'Average', 'value': 'avg'},
                                    {'label': 'Sum', 'value': 'sum'},
                                    {'label': 'Maximum', 'value': 'max'},
                                    {'label': 'Minimum', 'value': 'min'},
                                    {'label': 'Standard Deviation', 'value': 'std'}
                                ],
                                placeholder="Select aggregation...",
                                className="mb-3"
                            )
                        ], md=6),
                        dbc.Col([
                            dbc.Label("Group By"),
                            dcc.Dropdown(
                                id='group-by',
                                options=[],
                                placeholder="Group by...",
                                className="mb-3"
                            )
                        ], md=6)
                    ]),
                    dbc.Row([
                        dbc.Col([
                            dbc.Label("Date Range Filter"),
                            dcc.DatePickerRange(
                                id='date-range',
                                min_date_allowed=date(2010, 1, 1),
                                max_date_allowed=date.today(),
                                initial_visible_month=date.today(),
                                start_date=date.today() - timedelta(days=365),
                                end_date=date.today()
                            )
                        ], md=12)
                    ], className="mt-3"),
                    dbc.Row([
                        dbc.Col([
                            dbc.Button("Apply Filters", 
                                       id='apply-filters',
                                       color="primary",
                                       className="mt-3 w-100")
                        ], md=12)
                    ])
                ])
            ], className="shadow-sm mb-4")
        ], md=4),
        
        # Visualization area
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("Visualization", className="bg-primary text-white"),
                dbc.CardBody([
                    dcc.Loading(
                        id="loading-visualization",
                        type="circle",
                        children=dcc.Graph(
                            id='student-visualization',
                            config={'displayModeBar': True},
                            style={'height': '500px'}
                        )
                    ),
                    html.Div(id='graph-statistics', className="mt-3")
                ])
            ], className="shadow-sm mb-4")
        ], md=8)
    ]),
    
    # Data table
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader("Raw Data", className="bg-primary text-white"),
                dbc.CardBody([
                    dash_table.DataTable(
                        id='data-table',
                        page_size=10,
                        style_table={'overflowX': 'auto'},
                        style_cell={
                            'textAlign': 'left',
                            'padding': '10px',
                            'whiteSpace': 'normal',
                            'height': 'auto'
                        },
                        style_header={
                            'backgroundColor': '#f8f9fa',
                            'fontWeight': 'bold'
                        },
                        filter_action="native",
                        sort_action="native"
                    )
                ])
            ], className="shadow-sm")
        ], width=12)
    ]),
    
    # Hidden div for storing data
    html.Div(id='stored-data', style={'display': 'none'}),
    
    # Refresh interval
    dcc.Interval(
        id='interval-component',
        interval=60*1000,  # Update every minute
        n_intervals=0
    )
], fluid=True)

# Fetch column names from database
def get_table_columns():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("SHOW COLUMNS FROM students")
        columns = [column[0] for column in cursor.fetchall()]
        cursor.close()
        conn.close()
        return columns
    except Exception as e:
        print(f"Error fetching columns: {e}")
        return []

# Fetch data from database with date filtering
def fetch_student_data(selected_columns, date_col=None, start_date=None, end_date=None):
    if not selected_columns:
        return pd.DataFrame()
    
    try:
        conn = mysql.connector.connect(**db_config)
        
        base_query = f"SELECT {', '.join(selected_columns)} FROM students"
        conditions = []
        params = []
        
        # Add date filtering if specified
        if date_col and start_date and end_date:
            conditions.append(f"{date_col} BETWEEN %s AND %s")
            params.extend([start_date, end_date])
        
        query = base_query
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        df = pd.read_sql(query, conn, params=params if params else None)
        conn.close()
        return df
    except Exception as e:
        print(f"Error fetching data: {e}")
        return pd.DataFrame()

# Callback to update column dropdowns and detect date columns
@app.callback(
    [Output('column-selector', 'options'),
     Output('group-by', 'options'),
     Output('date-range', 'display_format'),
     Output('date-range', 'style')],
    Input('interval-component', 'n_intervals')
)
def update_columns(n):
    columns = get_table_columns()
    options = [{'label': col, 'value': col} for col in columns]
    
    # Hide date picker if no date columns exist
    date_columns = [col for col in columns if 'date' in col.lower() or 'time' in col.lower()]
    date_style = {'display': 'block'} if date_columns else {'display': 'none'}
    
    return options, options, 'YYYY-MM-DD', date_style

# Main callback for processing data and updating visualizations
@app.callback(
    [Output('student-visualization', 'figure'),
     Output('data-table', 'data'),
     Output('data-table', 'columns'),
     Output('stored-data', 'children'),
     Output('graph-statistics', 'children')],
    [Input('apply-filters', 'n_clicks')],
    [State('column-selector', 'value'),
     State('chart-type', 'value'),
     State('aggregation-selector', 'value'),
     State('group-by', 'value'),
     State('date-range', 'start_date'),
     State('date-range', 'end_date')]
)
def update_dashboard(n_clicks, selected_columns, chart_type, aggregation, group_by, start_date, end_date):
    if not selected_columns:
        raise PreventUpdate
    
    # Find the first date column if exists
    date_col = None
    if selected_columns:
        date_cols = [col for col in selected_columns if 'date' in col.lower() or 'time' in col.lower()]
        date_col = date_cols[0] if date_cols else None
    
    df = fetch_student_data(selected_columns, date_col, start_date, end_date)
    
    if df.empty:
        return (px.scatter(title="No data available"), 
                [], 
                [], 
                df.to_json(date_format='iso', orient='split'),
                html.P("No data to display", className="text-muted"))
    
    # Store the data for download
    stored_data = df.to_json(date_format='iso', orient='split')
    
    # Create visualization based on chart type
    fig = create_visualization(df, selected_columns, chart_type, aggregation, group_by)
    
    # Generate statistics summary
    stats_card = generate_statistics(df, selected_columns)
    
    # Prepare data table
    table_data = df.to_dict('records')
    table_columns = [{'name': col, 'id': col} for col in df.columns]
    
    return fig, table_data, table_columns, stored_data, stats_card

def create_visualization(df, selected_columns, chart_type, aggregation, group_by):
    # Apply aggregation if specified
    if aggregation and group_by and len(selected_columns) >= 2:
        agg_column = [col for col in selected_columns if col != group_by][0]
        df = df.groupby(group_by).agg({agg_column: aggregation}).reset_index()
        y_column = agg_column
    elif len(selected_columns) >= 2:
        x_column, y_column = selected_columns[0], selected_columns[1]
    else:
        x_column, y_column = selected_columns[0], selected_columns[0]
    
    # Create visualization based on chart type
    if chart_type == 'bar':
        fig = px.bar(df, x=group_by or x_column, y=y_column, 
                    title=f"Student Data Analysis ({aggregation if aggregation else 'Values'})",
                    template="plotly_white")
    elif chart_type == 'pie':
        fig = px.pie(df, names=group_by or x_column, values=y_column, 
                    title="Student Data Distribution",
                    template="plotly_white")
    elif chart_type == 'scatter':
        fig = px.scatter(df, x=x_column, y=y_column, color=group_by, 
                        title="Student Data Correlation",
                        template="plotly_white")
    elif chart_type == 'histogram':
        fig = px.histogram(df, x=x_column, nbins=20, 
                          title="Student Data Distribution",
                          template="plotly_white")
    elif chart_type == 'box':
        fig = px.box(df, x=group_by or x_column, y=y_column, 
                    title="Student Data Statistics",
                    template="plotly_white")
    elif chart_type == 'line':
        fig = px.line(df, x=group_by or x_column, y=y_column, 
                     title="Student Data Trend",
                     template="plotly_white")
    elif chart_type == 'violin':
        fig = px.violin(df, x=group_by or x_column, y=y_column, 
                       title="Student Data Distribution",
                       template="plotly_white")
    else:
        fig = px.scatter(title="Select a valid chart type")
    
    fig.update_layout(
        transition_duration=500,
        hovermode='closest',
        plot_bgcolor='rgba(240,240,240,0.9)',
        margin=dict(l=20, r=20, t=40, b=20)
    )
    
    return fig

def generate_statistics(df, columns):
    stats = []
    for col in columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            stats.append({
                'column': col,
                'mean': df[col].mean(),
                'median': df[col].median(),
                'min': df[col].min(),
                'max': df[col].max(),
                'std': df[col].std()
            })
    
    if not stats:
        return html.P("No numeric columns for statistics", className="text-muted")
    
    return dbc.Table([
        html.Thead(html.Tr([html.Th("Column"), html.Th("Mean"), html.Th("Median"), 
                           html.Th("Min"), html.Th("Max"), html.Th("Std Dev")])),
        html.Tbody([
            html.Tr([
                html.Td(stat['column']),
                html.Td(round(stat['mean'], 2)),
                html.Td(round(stat['median'], 2)),
                html.Td(round(stat['min'], 2)),
                html.Td(round(stat['max'], 2)),
                html.Td(round(stat['std'], 2))
            ]) for stat in stats
        ])
    ], bordered=True, hover=True, responsive=True)

if __name__ == '__main__':
    app.run(debug=True, port=8050)