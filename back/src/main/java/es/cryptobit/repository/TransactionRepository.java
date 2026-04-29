package es.cryptobit.repository;

import es.cryptobit.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface TransactionRepository extends MongoRepository<Transaction, String> {
    List<Transaction> findBySenderId(String senderId);
    List<Transaction> findByReceiverId(String receiverId);
}