# Fix: MongoDB Transaction Error

## Problema
```
MongoQueryException: Command failed with error 20 (IllegalOperation): 
'Transaction numbers are only allowed on a replica set member or mongos'
```

## Causa
O MongoDB standalone (modo de desenvolvimento local) **NÃO suporta transações**. 
Transações só funcionam em **Replica Sets** ou **MongoDB Atlas**.

## Soluções

### Opção 1: Desabilitar Transações no Quarkus (Recomendado para DEV)

No arquivo `application.properties`:

```properties
# Desabilitar transações do MongoDB
quarkus.mongodb.transaction=false
```

### Opção 2: Remover @Transactional dos Métodos

No arquivo `CustomerService.java` (linha 17):

```java
// ANTES
@Transactional
public Customer createOrUpdateCustomer(CreateCustomerRequest request) {
    // ...
}

// DEPOIS (remover @Transactional)
public Customer createOrUpdateCustomer(CreateCustomerRequest request) {
    // ...
}
```

### Opção 3: Configurar MongoDB Replica Set Local (Mais Complexo)

1. Parar MongoDB:
```bash
sudo systemctl stop mongod
```

2. Editar `/etc/mongod.conf`:
```yaml
replication:
  replSetName: "rs0"
```

3. Reiniciar MongoDB:
```bash
sudo systemctl start mongod
```

4. Inicializar Replica Set:
```bash
mongosh
> rs.initiate()
```

### Opção 4: Usar MongoDB Atlas (Produção)

MongoDB Atlas já vem configurado com Replica Set e suporta transações nativamente.

## Recomendação

Para desenvolvimento local, use a **Opção 1** (desabilitar transações) ou **Opção 2** (remover @Transactional).

Para produção, use **MongoDB Atlas** ou configure um Replica Set adequado.
