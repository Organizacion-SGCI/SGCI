# Base de datos falsa para las pruebas unitarias.
# Imita lo mínimo del engine de SQLAlchemy que usan los repositories:
# engine.connect() / engine.begin(), connection.execute(), fetchone(),
# fetchall(), iteración y fila._mapping.

class Fila:
    """Imita una fila de SQLAlchemy: acceso por atributo y por _mapping."""

    def __init__(self, **campos):
        self.__dict__.update(campos)
        self._mapping = dict(campos)


class ResultadoFalso:
    def __init__(self, filas):
        self._filas = list(filas)

    def fetchone(self):
        return self._filas[0] if self._filas else None

    def fetchall(self):
        return list(self._filas)

    def mappings(self):
        return [fila._mapping for fila in self._filas]

    def __iter__(self):
        return iter(self._filas)


class ConexionFalsa:
    def __init__(self, motor):
        self.motor = motor

    def execute(self, sentencia, parametros=None):
        self.motor.ejecutadas.append((str(sentencia), parametros))

        if not self.motor.respuestas:
            return ResultadoFalso([])

        respuesta = self.motor.respuestas.pop(0)

        if isinstance(respuesta, Exception):
            raise respuesta

        return ResultadoFalso(respuesta)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class MotorFalso:
    """
    Reemplazo del engine de SQLAlchemy.

    respuestas: lista con una entrada por cada execute(), en orden.
    Cada entrada es una lista de Fila (o una excepción para simular errores).
    """

    def __init__(self, respuestas=None):
        self.respuestas = list(respuestas or [])
        self.ejecutadas = []
        self.transacciones = 0
        self.conexiones = 0

    def connect(self):
        self.conexiones += 1
        return ConexionFalsa(self)

    def begin(self):
        self.transacciones += 1
        return ConexionFalsa(self)

    @property
    def sql(self):
        """Lista solo con el texto SQL de cada consulta ejecutada."""
        return [sql for sql, _ in self.ejecutadas]

    @property
    def parametros(self):
        """Lista solo con los parámetros de cada consulta ejecutada."""
        return [parametros for _, parametros in self.ejecutadas]
