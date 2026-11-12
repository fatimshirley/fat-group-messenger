from sqlalchemy import text
from src.database.connection import engine


try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version()"))
        print("Connexion PostgreSQL réussie !")
        print(result.scalar())

except Exception as error:
    print("Erreur de connexion :")
    print(error)