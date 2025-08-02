import os
from typing import Any, Dict, List
import mysql.connector.pooling
from mysql.connector import Error

class DatabaseManager:
    def __init__(self, config: dict):
        self.config = {
            'host': config['host'],
            'user': config['user'],
            'password': config['password'],
            'database': config['database'],
            'connect_timeout': config.get('connect_timeout', 30)
        }
        self.pool_name = config.get('pool_name', 'mypool')
        self.pool_size = config.get('pool_size', 5)
        self._create_pool()

    def _create_pool(self):
        """Create connection pool with error handling"""
        try:
            self.pool = mysql.connector.pooling.MySQLConnectionPool(
                pool_name=self.pool_name,
                pool_size=self.pool_size,
                **self.config
            )
            # Test the pool
            conn = self.pool.get_connection()
            conn.close()
        except Error as err:
            raise RuntimeError(f"Failed to create connection pool: {err}")

    def get_connection(self):
        """Get a connection with automatic reconnection"""
        try:
            conn = self.pool.get_connection()
            if not conn.is_connected():
                conn.reconnect(attempts=3, delay=1)
            return conn
        except Error as err:
            raise RuntimeError(f"Failed to get connection: {err}")
        
    def execute_query(self, query: str, params: tuple = None) -> List[Dict]:
        """Execute query with safe parameter handling."""
        conn = self.get_connection()
        try:
            with conn.cursor(dictionary=True) as cursor:
                cursor.execute(query, params or ())
                if query.strip().lower().startswith('select'):
                    return cursor.fetchall()
                conn.commit()
                return []
        except Error as err:
            raise Exception(f"Query execution failed: {err.msg}")
        finally:
            conn.close()

    def get_excluded_columns(self) -> set:
        try:
            with open(os.path.join("app", "excluded_columns.txt"), "r") as f:
                excluded = {line.strip() for line in f if line.strip() and not line.startswith("#")}
            return excluded
        except Exception as e:
            print(f"Warning: Failed to load excluded_columns.txt - {e}")
            return set()

    def get_table_schema(self) -> str:
        excluded_columns = self.get_excluded_columns()
        conn = self.get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = 'students' AND TABLE_SCHEMA = %s
                """, (self.config['database'],))
                columns = cursor.fetchall()

                schema_str = "Table: students\nColumns:\n"
                for col in columns:
                    column_name = col[0]
                    if column_name not in excluded_columns:
                        schema_str += f"- {column_name}: {col[1]} ({col[2]})\n"
                return schema_str
        finally:
            conn.close()
    
    def save_chat(self, **kwargs):
        """Save chat history with parameter validation."""
        required_fields = {
            'user_id': kwargs.get('user_id'),
            'message': kwargs.get('message'),
            'response': kwargs.get('response')
        }
        
        if None in required_fields.values():
            raise ValueError("Missing required chat fields")
            
        query = """
        INSERT INTO chats (
            user_id, conversation_id, message, 
            response, sql_query, query_results, explanation
        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        conn = self.get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, (
                    kwargs.get('user_id'),
                    kwargs.get('conversation_id'),
                    kwargs.get('message'),
                    kwargs.get('response'),
                    kwargs.get('sql_query'),
                    kwargs.get('query_results'),
                    kwargs.get('explanation')
                ))
                conn.commit()
        except Error as err:
            raise Exception(f"Chat save failed: {err.msg}")
        finally:
            conn.close()

    def get_chat_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        query = """
        SELECT message, response, sql_query, query_results, created_at
        FROM chats
        WHERE conversation_id = %s
        ORDER BY created_at ASC
        """
        return self.execute_query(query, (conversation_id,))
    
    def get_user_chats(self, user_id: str) -> List[Dict[str, Any]]:
        query = """
        SELECT message, response AS explanation, sql_query, query_results, created_at
        FROM chats
        WHERE user_id = %s
        ORDER BY created_at ASC
        """
        return self.execute_query(query, (user_id,))
    
    def get_db_uri(self) -> str:
        """Get SQLAlchemy compatible connection URI"""
        return f"mysql+pymysql://{self.config['user']}:{self.config['password']}@{self.config['host']}/{self.config['database']}"